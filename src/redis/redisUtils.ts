import redis from './redisClient';
import logger from '../logger';

const API_ENV = process.env.API_ENV || 'DEV';
const RED_PA_MAX = 16;
const BLUE_PA_MAX = 8;

type ConsumePAOptions = {
  creatureUUID: string;
  redpa?: number;
  bluepa?: number;
  duration?: number;
};

type PAResult = {
  pa: number;
  ttnpa: number;
  ttl: number;
};

type PAResponse = {
  blue: PAResult;
  red: PAResult;
};

/**
 * Consumes a specified number of blue and/or red PAs for a Creature.
 * @param creatureUUID The UUID of the creature.
 * @param redpa The number of red PAs to consume (default is 0).
 * @param bluepa The number of blue PAs to consume (default is 0).
 * @param duration The duration of each PA in seconds (default is 3600 seconds).
 */
export async function consumePA({
  creatureUUID,
  redpa = 0,
  bluepa = 0,
  duration = 3600
}: ConsumePAOptions): Promise<void> {
  const blueKey = `${API_ENV}:pas:${creatureUUID}:blue`;
  const redKey = `${API_ENV}:pas:${creatureUUID}:red`;

  // Fetch current TTLs for both blue and red
  const [blueTTL, redTTL] = await Promise.all([
    redis.ttl(blueKey),
    redis.ttl(redKey)
  ]);

  if (bluepa > 0) {
    logger.debug(`Creature.id:${creatureUUID} Consuming PA (blue:${bluepa})`);
    const newBlueTTL = blueTTL + (bluepa * duration);
    if (blueTTL > 0) {
      // Key still exists (PA count < PA max)
      await redis.expire(blueKey, newBlueTTL);
    } else {
      // Key does not exist anymore (PA count = PA max)
      await redis.set(blueKey, 'None', 'EX', newBlueTTL);
    }
  }

  if (redpa > 0) {
    logger.debug(`Creature.id:${creatureUUID} Consuming PA (red:${redpa})`);
    const newRedTTL = redTTL + (redpa * duration);
    if (redTTL > 0) {
      // Key still exists (PA count < PA max)
      await redis.expire(redKey, newRedTTL);
    } else {
      // Key does not exist anymore (PA count = PA max)
      await redis.set(redKey, 'None', 'EX', newRedTTL);
    }
  }
}

/**
 * Retrieves the blue and red PA and their TTL for a Creature.
 * @param creatureUUID The UUID of the creature.
 * @param duration The duration in seconds for PA calculation. Default is 3600 seconds (1 hour).
 * @returns A Promise resolving to an object with PA and TTL information for both blue and red.
 */
export async function getPA(creatureUUID: string, duration: number = 3600): Promise<PAResponse> {
  // Fetch TTLs from Redis (returns seconds, or -2 if key does not exist, -1 if no expire)
  const [blueTtl, redTtl] = await Promise.all([
    redis.ttl(`${API_ENV}:pas:${creatureUUID}:blue`),
    redis.ttl(`${API_ENV}:pas:${creatureUUID}:red`)
  ]);

  const BLUE_PA_MAXTTL = BLUE_PA_MAX * duration;
  const RED_PA_MAXTTL = RED_PA_MAX * duration;

  const bluePa = Math.round((BLUE_PA_MAXTTL - Math.abs(blueTtl)) / duration);
  const redPa = Math.round((RED_PA_MAXTTL - Math.abs(redTtl)) / duration);

  return {
    blue: {
      pa: bluePa,
      ttnpa: blueTtl % duration,
      ttl: blueTtl
    },
    red: {
      pa: redPa,
      ttnpa: redTtl % duration,
      ttl: redTtl
    }
  };
}