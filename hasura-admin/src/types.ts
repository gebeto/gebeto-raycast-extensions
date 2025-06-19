import { PostgresSourceMetadata } from "@hasura/metadata-api";

export type ActionMetadata = {
  name: string;
  definition: {
    handler: string;
    output_type: string;
    forward_client_headers: boolean;
    arguments: any[];
    type: "mutation";
    kind: "synchronous" | "synchronous";
  };
  permissions: {
    role: string;
  }[];
};

export type Metadata = {
  actions?: ActionMetadata[];
  sources: PostgresSourceMetadata[];
};

export type MetadataResponse = {
  metadata: Metadata;
};
