import { IconType } from 'react-icons';
import * as Fa from 'react-icons/fa';
import * as Si from 'react-icons/si';
import * as Bi from 'react-icons/bi';
import * as Hi from 'react-icons/hi';
import * as Ri from 'react-icons/ri';
import * as Tb from 'react-icons/tb';

interface IconResolverProps {
  iconName: string;
  className?: string;
  size?: number | string;
}

export function IconResolver({ iconName, className, size = 20 }: IconResolverProps) {
  if (!iconName) return null;

  // Determine the set based on the first two letters (e.g., FaReact -> Fa)
  const prefix = iconName.substring(0, 2);
  
  let IconComponent: IconType | undefined;

  switch (prefix) {
    case 'Fa':
      IconComponent = (Fa as Record<string, IconType>)[iconName];
      break;
    case 'Si':
      IconComponent = (Si as Record<string, IconType>)[iconName];
      break;
    case 'Bi':
      IconComponent = (Bi as Record<string, IconType>)[iconName];
      break;
    case 'Hi':
      IconComponent = (Hi as Record<string, IconType>)[iconName];
      break;
    case 'Ri':
      IconComponent = (Ri as Record<string, IconType>)[iconName];
      break;
    case 'Tb':
      IconComponent = (Tb as Record<string, IconType>)[iconName];
      break;
    default:
      // If it doesn't match a known prefix or is a URL, we might want to return null 
      // and let the caller handle it (e.g., render an img tag)
      return null;
  }

  if (!IconComponent) {
    return null;
  }

  return <IconComponent className={className} size={size} />;
}
