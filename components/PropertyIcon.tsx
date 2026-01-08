
import React from 'react';
import { Home, Building2, Map as MapIcon } from 'lucide-react';
import { PropertyType } from '../types';

interface Props {
  type: PropertyType;
  className?: string;
  size?: number;
}

export const PropertyIcon: React.FC<Props> = ({ type, className = "text-white", size = 48 }) => {
  switch (type) {
    case PropertyType.HOUSE:
      return <Home className={className} size={size} />;
    case PropertyType.APARTMENT:
      return <Building2 className={className} size={size} />;
    case PropertyType.LAND:
      return <MapIcon className={className} size={size} />;
    default:
      return <Home className={className} size={size} />;
  }
};
