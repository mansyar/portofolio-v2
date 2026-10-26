const DEFAULT_SITE_URL = "https://ansyar-world.top";

/**
 * Public origin used to build links in outgoing mail, without a trailing slash.
 * An empty `SITE_URL` is treated as unset: `""` is not a usable origin and would
 * otherwise produce scheme-less links.
 */
export function siteUrl(): string {
  const configured = process.env.SITE_URL?.trim();
  return (configured || DEFAULT_SITE_URL).replace(/\/+$/, "");
}

/** Opt-out link carrying the subscriber's token. */
export function buildUnsubscribeUrl(token: string): string {
  return `${siteUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;
}

/**
 * The welcome email body. The opt-out link is omitted rather than emitted broken when a
 * row has no token yet (rows written before the backfill ran).
 */
export function buildWelcomeEmailHtml(token?: string): string {
  const footer = token
    ? `<p style="margin-top: 16px; font-size: 12px;">> <a href="${buildUnsubscribeUrl(token)}" style="color: #0f0;">Unsubscribe</a></p>`
    : "";

  return `
          <div style="font-family: monospace; background: #000; color: #0f0; padding: 20px;">
            <h1>$ subscribe --success</h1>
            <p>> Thank you for joining my newsletter!</p>
            <p>> You'll receive updates on new blog posts and projects.</p>
            ${footer}
            <br />
            <p>-- <br />Ansyar</p>
          </div>
        `;
}
