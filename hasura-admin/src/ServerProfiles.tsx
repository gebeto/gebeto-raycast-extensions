import React from "react";
import { LocalStorage } from "@raycast/api";
import { useCachedPromise } from "@raycast/utils";
import fetch from "node-fetch";
import { MetadataResponse } from "./types";

export type ServerDetails = {
  id: string;
  metadataUrl: string;
  consoleUrl: string;
  secret: string;
};

export const servers: ServerDetails[] = [
  {
    id: "localhost:9695",
    metadataUrl: "http://localhost:8080/v1/metadata",
    consoleUrl: "http://localhost:9695/console",
    secret: "secretsecretsecret",
  },
  {
    id: "localhost:1111",
    metadataUrl: "http://localhost:1111/v1/metadata",
    consoleUrl: "http://localhost:1111/console",
    secret: "1111",
  },
  {
    id: "localhost:8080",
    metadataUrl: "http://localhost:8080/v1/metadata",
    consoleUrl: "http://localhost:8080/console",
    secret: "secretsecretsecret",
  },
];

export const serverById = servers.reduce(
  (prev, curr) => ({
    ...prev,
    [curr.id]: curr,
  }),
  {} as Record<string, ServerDetails>
);

export const useMetadata = (server?: ServerDetails) => {
  const { data, isLoading } = useCachedPromise(
    async (server) => {
      if (!server) return null;
      try {
        const response = await fetch(server.metadataUrl, {
          method: "POST",
          headers: {
            "x-hasura-admin-secret": server.secret,
          },
          body: JSON.stringify({
            args: {},
            type: "export_metadata",
            version: 2,
          }),
        }).then((res) => res.json() as unknown as MetadataResponse);

        return response.metadata;
      } catch (err) {
        return null;
      }
    },
    [server]
  );

  return { metadata: data, isLoading };
};

export const useConfig = () => {
  const [serverId, setServerId] = React.useState<string>(servers[0].id);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const currentServerId = await LocalStorage.getItem<string>("currentServerId");

      if (currentServerId) {
        setServerId(currentServerId);
      }

      setIsLoading(false);
    })();
  }, []);

  React.useEffect(() => {
    (async () => {
      if (serverId) {
        await LocalStorage.setItem("currentServerId", serverId);
      }
    })();
  }, [serverId]);

  return { serverId, setServerId, isLoading };
};
