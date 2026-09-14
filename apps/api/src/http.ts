import { RequestMethod } from '@nestjs/common';

export const GLOBAL_PREFIX_OPTIONS: {
  exclude: Array<{ path: string; method: RequestMethod }>;
} = {
  exclude: [
    { path: 'health', method: RequestMethod.GET },
    { path: 'health/ready', method: RequestMethod.GET },
  ],
};
