import React, { forwardRef } from 'react';
import type { ComponentProps } from 'react';
import { Video } from 'expo-av';

type AnyVideoProps = Record<string, any>;

export type CompatVideoProps = ComponentProps<typeof Video> & AnyVideoProps;

const CompatVideo = forwardRef<any, CompatVideoProps>((props, ref) => {
  return <Video ref={ref} {...props} />;
});

export default CompatVideo;


