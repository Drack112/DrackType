import _ from "lodash";
import { Configuration } from "@dracktype/schemas/configuration";
import { join } from "path";
import { BASE_CONFIGURATION } from "../constants/base-configuration";
import Logger from "../utils/logger";
import * as db from "../init/db";
import { ObjectId } from "mongodb";
import { getErrorMessage } from "../utils/error";
import { addLog } from "../dal/logs";
import { PartialConfiguration } from "@dracktype/contracts/configuration";
import { identity } from "../utils/misc";

const CONFIG_UPDATE_INTERVAL = 10 * 60 * 1000;
const SERVER_CONFIG_FILE_PATH = join(
  __dirname,
  "../backend-configuration.json"
);

function mergeConfigurations(
  baseConfiguration: Configuration,
  liveConfiguration: PartialConfiguration
): void {
  if (
    !_.isPlainObject(baseConfiguration) ||
    !_.isPlainObject(liveConfiguration)
  ) {
    return;
  }

  function merge(base: object, source: object): void {
    const commonKeys = _.intersection(_.keys(base), _.keys(source));

    commonKeys.forEach((key) => {
      const baseValue = base[key] as object;
      const sourceValue = source[key] as object;

      const isBaseValueObject = _.isPlainObject(baseValue);
      const isSourceValueObject = _.isPlainObject(sourceValue);

      if (isBaseValueObject && isSourceValueObject) {
        merge(baseValue, sourceValue);
      } else if (identity(baseValue) === identity(sourceValue)) {
        base[key] = sourceValue;
      }
    });
  }

  merge(baseConfiguration, liveConfiguration);
}

let configuration = BASE_CONFIGURATION;
let lastFetchTime = 0;
let serverConfigurationUpdated = false;

export async function getCachedConfiguration(
  attemptCacheUpdate = false
): Promise<Configuration> {
  if (
    attemptCacheUpdate &&
    lastFetchTime < Date.now() - CONFIG_UPDATE_INTERVAL
  ) {
    Logger.info("Cached configuration is stale");
    return await getLiveConfiguration();
  }

  return configuration;
}

export async function getLiveConfiguration(): Promise<Configuration> {
  lastFetchTime = Date.now();

  const configurationCollection = db.collection("configuration");

  try {
    const liveConfiguration = await configurationCollection.findOne();
    if (liveConfiguration) {
      const baseConfiguration = _.cloneDeep(BASE_CONFIGURATION);
      const liveConfigurationWithoutId = _.omit(
        liveConfiguration,
        "_id"
      ) as Configuration;
      mergeConfigurations(baseConfiguration, liveConfigurationWithoutId);

      await pushConfiguration(baseConfiguration);
      configuration = baseConfiguration;
    } else {
      await configurationCollection.insertOne({
        ...BASE_CONFIGURATION,
        _id: new ObjectId(),
      });
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog(
      "fetch_configuration_failure",
      `Could not fetch configuration: ${errorMessage}`
    );
  }

  return configuration;
}

async function pushConfiguration(configuration: Configuration): Promise<void> {
  if (serverConfigurationUpdated) {
    return;
  }

  try {
    await db.collection("configuration").replaceOne({}, configuration);
    serverConfigurationUpdated = true;
  } catch (error) {
    const errorMessage = getErrorMessage(error) ?? "Unknown error";
    void addLog(
      "push_configuration_failure",
      `Could not push configuration: ${errorMessage}`
    );
  }
}
