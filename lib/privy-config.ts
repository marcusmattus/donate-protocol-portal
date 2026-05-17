import { PrivyClient } from '@privy-io/react-auth';

export const privyConfig = {
  appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
  appSecret: process.env.PRIVY_APP_SECRET || '',
};

export const initPrivyClient = () => {
  if (!privyConfig.appId) {
    throw new Error('NEXT_PUBLIC_PRIVY_APP_ID is not set');
  }

  return new PrivyClient({
    appId: privyConfig.appId,
  });
};
