import { IconType } from 'react-icons';
import { useState, useEffect, memo } from 'react';

interface IconResolverProps {
  iconName: string;
  className?: string;
  size?: number | string;
}

// Map common lowercase aliases to their full react-icons names
// This allows CMS users to enter 'react' instead of 'SiReact'
const aliasMap: Record<string, string> = {
  'react': 'SiReact',
  'javascript': 'SiJavascript',
  'typescript': 'SiTypescript',
  'node': 'SiNodedotjs',
  'nodejs': 'FaNodeJs',
  'tailwind': 'SiTailwindcss',
  'docker': 'SiDocker',
  'database': 'FaDatabase',
  'code': 'FaCode',
  'terminal': 'FaTerminal',
  'aws': 'FaAws',
  'nextjs': 'TbBrandNextjs',
  's3': 'SiAmazons3',
  'postgresql': 'SiPostgresql',
  'mongodb': 'SiMongodb',
  'github': 'SiGithub',
  'vercel': 'SiVercel',
  'netlify': 'SiNetlify',
  'figma': 'SiFigma',
  'photoshop': 'SiAdobephotoshop',
  'globe': 'FaGlobe',
  'server': 'FaServer',
  'python': 'SiPython',
  'go': 'SiGo',
  'rust': 'SiRust',
  'java': 'SiOpenjdk',
  'linux': 'SiLinux',
  'git': 'SiGit',
  'vscode': 'SiVisualstudiocode',
  'kubernetes': 'SiKubernetes',
  'terraform': 'SiTerraform',
  'redis': 'SiRedis',
  'graphql': 'SiGraphql',
  'firebase': 'SiFirebase',
  'convex': 'FaDatabase',
};

// Prefix to package path mapping
const prefixToPath: Record<string, string> = {
  'Fa': 'fa',
  'Si': 'si',
  'Bi': 'bi',
  'Hi': 'hi',
  'Ri': 'ri',
  'Tb': 'tb',
  'Md': 'md',
  'Io': 'io',
  'Gi': 'gi',
  'Ti': 'ti',
  'Fi': 'fi',
  'Ai': 'ai',
  'Bs': 'bs',
  'Cg': 'cg',
  'Di': 'di',
  'Go': 'go',
  'Gr': 'gr',
  'Im': 'im',
  'Lu': 'lu',
  'Pi': 'pi',
  'Rx': 'rx',
  'Sl': 'sl',
  'Vsc': 'vsc',
  'Wi': 'wi',
};

function IconResolverComponent({ iconName, className, size = 20 }: IconResolverProps) {
  const [IconComponent, setIconComponent] = useState<IconType | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!iconName) {
      setIconComponent(null);
      return;
    }

    let isMounted = true;
    setError(false);

    const loadIcon = async () => {
      try {
        // Resolve alias to full icon name if needed
        const resolvedName = aliasMap[iconName.toLowerCase()] || iconName;
        
        // Get prefix (first 2-3 characters that are uppercase)
        const prefixMatch = resolvedName.match(/^[A-Z][a-z]?[a-z]?/);
        if (!prefixMatch) {
          setError(true);
          return;
        }
        
        const prefix = prefixMatch[0];
        const packagePath = prefixToPath[prefix];
        
        if (!packagePath) {
          console.warn(`Unknown icon prefix: ${prefix} for icon: ${resolvedName}`);
          setError(true);
          return;
        }

        // Dynamic import from @react-icons/all-files
        // Each icon is in its own file, so this only loads the specific icon needed
        const iconModule = await import(
          /* @vite-ignore */
          `@react-icons/all-files/${packagePath}/${resolvedName}.js`
        );
        
        if (isMounted && iconModule[resolvedName]) {
          setIconComponent(() => iconModule[resolvedName]);
        } else if (isMounted) {
          console.warn(`Icon "${resolvedName}" not found in module`);
          setError(true);
        }
      } catch (err) {
        console.warn(`Failed to load icon "${iconName}":`, err);
        if (isMounted) setError(true);
      }
    };

    loadIcon();

    return () => {
      isMounted = false;
    };
  }, [iconName]);

  if (!iconName || error) return null;
  
  if (!IconComponent) {
    // Return a placeholder with the same size to prevent layout shift
    return (
      <div 
        style={{ width: size, height: size }} 
        className={`${className} animate-pulse rounded bg-current opacity-20`} 
      />
    );
  }

  return <IconComponent className={className} size={size} />;
}

// Memoize to prevent unnecessary re-renders and re-fetches
export const IconResolver = memo(IconResolverComponent);

