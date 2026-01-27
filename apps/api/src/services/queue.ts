import IORedis from 'ioredis';

const redis = new IORedis({
  host: 'localhost',
  port: 6379,
});

export const addScanJob = async (scanId: string, specContent: string) => {
  const job = JSON.stringify({ scanId, specContent });
  await redis.rpush('vulx:scan-queue', job);
};
