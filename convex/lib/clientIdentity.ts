/**
 * Resolves the rate-limiting identity from the request the server actually
 * received.
 *
 * The deployment sits behind one reverse proxy. That proxy appends the address
 * it saw to `x-forwarded-for`, so anything a caller writes arrives to the *left*
 * of a value the proxy vouched for. Reading the first entry — which the previous
 * implementation did — therefore hands the identity to the caller.
 *
 * The rule here is: drop every private, loopback, link-local, and unspecified
 * entry, and take the rightmost survivor. With one proxy hop that is the client.
 * With container-to-container hops the proxies' addresses are private and are
 * skipped, so it is still the client. A leading forged value is never reached
 * unless every genuine entry is private, in which case the caller cannot be
 * identified and `null` is the honest answer.
 *
 * Limitation: a CDN in front of the proxy terminates the client connection
 * itself, so its edge address — not the visitor's — would survive. Introducing
 * one requires revisiting this module; see the track's spec.
 */

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/** `::ffff:203.0.113.7` and `203.0.113.7` must not become two buckets. */
const IPV4_MAPPED_PATTERN = /^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/;

const IPV6_PATTERN = /^[0-9a-f:.]+$/;

const parseIpv4 = (value: string): number[] | null => {
  const match = IPV4_PATTERN.exec(value);
  if (!match) return null;

  const octets = match.slice(1).map((octet) => Number(octet));
  if (octets.some((octet) => octet > 255)) return null;

  return octets;
};

/**
 * Private, loopback, link-local, and reserved ranges. `100.64.0.0/10` (carrier
 * NAT) is deliberately treated as public: it is a real client seen through the
 * proxy, and collapsing it would hide one subscriber behind another.
 */
const isPublicIpv4 = (octets: number[]): boolean => {
  const [first, second] = octets;

  if (first === 0 || first === 10 || first === 127) return false;
  if (first === 169 && second === 254) return false;
  if (first === 172 && second >= 16 && second <= 31) return false;
  if (first === 192 && second === 168) return false;
  // Multicast (224/4) and reserved (240/4) are never a client address.
  if (first >= 224) return false;

  return true;
};

const isPublicIpv6 = (value: string): boolean => {
  if (!IPV6_PATTERN.test(value)) return false;
  if (value === "::" || value === "::1") return false;

  // ULA (fc00::/7) and link-local (fe80::/10). Only the first group matters for
  // both prefixes; a compressed leading group means the value starts with "::"
  // and is not one of them.
  const [firstGroup] = value.split(":");
  if (!firstGroup) return false;

  const group = Number.parseInt(firstGroup, 16);
  if ((group & 0xfe00) === 0xfc00) return false;
  if ((group & 0xffc0) === 0xfe80) return false;

  return true;
};

/**
 * Classifies one header entry. Returns the normalized address when it is a
 * public client address, otherwise `null` — invalid, private, or unusable.
 */
const classifyEntry = (entry: string): string | null => {
  // A zone index (`fe80::1%eth0`) is local to the sender and irrelevant here.
  const candidate = entry.trim().toLowerCase().split("%")[0];
  if (!candidate) return null;

  const mapped = IPV4_MAPPED_PATTERN.exec(candidate);
  const value = mapped ? mapped[1] : candidate;

  const octets = parseIpv4(value);
  // Joined back from the parsed octets so `203.000.113.7` cannot become a second
  // bucket for `203.0.113.7`.
  if (octets) return isPublicIpv4(octets) ? octets.join(".") : null;

  return isPublicIpv6(value) ? value : null;
};

export function resolveClientIdentity(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");

  if (forwardedFor) {
    const chain = forwardedFor.split(",");
    for (let index = chain.length - 1; index >= 0; index -= 1) {
      const identity = classifyEntry(chain[index]);
      if (identity) return identity;
    }
  }

  // `x-real-ip` is written by the same proxy from the same connection, so it is
  // an equivalent fallback when the chain carries nothing usable.
  const realIp = headers.get("x-real-ip");
  return realIp ? classifyEntry(realIp) : null;
}
