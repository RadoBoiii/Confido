import * as LiveKit from 'livekit-server-sdk';

// Test the LiveKit SDK
const apiKey = 'devkey';
const apiSecret = 'devsecret';

const token = new LiveKit.AccessToken(apiKey, apiSecret, {
  identity: 'test-user',
  name: 'Test User',
});

token.addGrant({
  roomJoin: true,
  room: 'test-room',
  canPublish: true,
  canSubscribe: true,
});

console.log('LiveKit token:', token.toJwt());
console.log('LiveKit SDK is working!'); 