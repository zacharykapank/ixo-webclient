import { rem } from '@mantine/core';

interface DaoIconProps extends React.ComponentPropsWithoutRef<'svg'> {
  size?: number | string;
}

export function DaoIcon({ size = 24, style, ...others }: DaoIconProps) {
  return (
    <svg
      id='icon'
      xmlns='http://www.w3.org/2000/svg'
      viewBox='0 0 140 140'
      style={{ width: rem(size), height: rem(size), ...style }}
      {...others}
    >
      <path
        id='Layer'
        fill={others.fill || 'currentColor'}
        d='M129.93,77.66c0-.88.07-1.77.07-2.66A60,60,0,0,0,89.92,18.4a20,20,0,0,0-39.84,0A60,60,0,0,0,10,75c0,.89,0,1.78.07,2.66A20,20,0,0,0,20,115a19.72,19.72,0,0,0,4.77-.6,60,60,0,0,0,90.46,0,19.72,19.72,0,0,0,4.77.6,20,20,0,0,0,9.93-37.34ZM70,124.09A48.93,48.93,0,0,1,34.45,108.8,20,20,0,0,0,20.91,75.05v0A49.15,49.15,0,0,1,52.27,29.24a20,20,0,0,0,35.46,0A49.15,49.15,0,0,1,119.09,75v0a20,20,0,0,0-13.54,33.75A48.93,48.93,0,0,1,70,124.09Z'
      />
    </svg>
  );
}
