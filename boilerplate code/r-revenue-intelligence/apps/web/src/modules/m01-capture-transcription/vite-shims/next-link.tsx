import React from 'react';
import { Link as RouterLink } from 'react-router-dom';

type Props = React.PropsWithChildren<{
  href: string;
  className?: string;
  style?: React.CSSProperties;
}>;

export default function Link({ href, children, className, style }: Props) {
  return (
    <RouterLink to={href} className={className} style={style}>
      {children}
    </RouterLink>
  );
}
