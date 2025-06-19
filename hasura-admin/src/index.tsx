import React from "react";
import { ActionPanel, Action, List, Form, Color } from "@raycast/api";
import { useConfig, useMetadata, serverById, servers, ServerDetails } from "./ServerProfiles";
import { PostgresQualified_TableName } from "@hasura/metadata-api";
import { ActionMetadata } from "./types";

export default function Command() {
  const { serverId, setServerId, isLoading: isConfigLoading } = useConfig();
  const server = isConfigLoading ? undefined : serverById?.[serverId as keyof typeof serverById];
  const { metadata, isLoading: isMetadataLoading } = useMetadata(server);
  const isLoading = isMetadataLoading || isConfigLoading;

  if (isLoading) {
    return <List isLoading searchBarPlaceholder="Search metadata..." />;
  }

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search metadata..."
      isShowingDetail
      searchBarAccessory={
        <List.Dropdown tooltip="Server" value={serverId} onChange={setServerId}>
          {servers.map((server) => (
            <List.Dropdown.Item key={server.id} title={server.id} value={server.id} />
          ))}
          <List.Dropdown.Section>
            <List.Dropdown.Item key="empty" title="Add server..." value="add" />
          </List.Dropdown.Section>
        </List.Dropdown>
      }
    >
      {metadata === null ? (
        <List.EmptyView title="Could not connect to the server" icon="❌" />
      ) : (
        <>
          <List.Section title="Tables" subtitle="hasura tables">
            {metadata?.sources?.map((source) =>
              source.tables.map((table) => {
                if (!server) return null;

                if (typeof table.table === "string") {
                  return (
                    <List.Item
                      key={table.table}
                      title={table.table}
                      actions={
                        <ActionPanel>
                          <Action.OpenInBrowser
                            title="Open in Browser"
                            url={`${server.consoleUrl}/data/default/schema/${table.table}/tables/${table.table}/browse`}
                          />
                        </ActionPanel>
                      }
                    />
                  );
                }

                return (
                  <TableListItem
                    key={`${table.table.schema}.${table.table.name}`}
                    server={server}
                    item={table.table}
                    metadata={JSON.stringify(table, undefined, 4)}
                  />
                );
              })
            )}
          </List.Section>
          <List.Section title="Actions" subtitle="hasura actions">
            {metadata?.actions?.map((action) => {
              if (!server) return null;
              return <ActionListItem key={action.name} server={server} item={action} />;
            })}
          </List.Section>
        </>
      )}
    </List>
  );
}

function ActionListItem({ server, item }: { server: ServerDetails; item: ActionMetadata }) {
  return (
    <List.Item
      title={item.name}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open in Browser"
              url={`${server.consoleUrl}/console/actions/manage/${item.name}/modify`}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
      detail={
        <List.Item.Detail
          markdown={"```json\n" + JSON.stringify(item, undefined, 4) + "\n```"}
          metadata={
            <List.Item.Detail.Metadata>
              <List.Item.Detail.Metadata.Label title="Type" text={item.definition.type} />
              <List.Item.Detail.Metadata.Label title="Kind" text={item.definition.kind} />
              <List.Item.Detail.Metadata.Label title="Handler" text={item.definition.handler} />
              <List.Item.Detail.Metadata.TagList title="Permissions">
                {item.permissions.map((permission) => (
                  <List.Item.Detail.Metadata.TagList.Item
                    key={permission.role}
                    text={permission.role}
                    color={Color.Green}
                  />
                ))}
              </List.Item.Detail.Metadata.TagList>
            </List.Item.Detail.Metadata>
          }
        />
      }
    />
  );
}

const FilterForm = (props: { schema: string; table: string; consoleUrl: string }) => {
  const [field, setField] = React.useState("id");
  const [filter, setFilter] = React.useState("$eq");
  const [value, setValue] = React.useState("");

  const url = React.useMemo(() => {
    const url = new URL(`${props.consoleUrl}/data/default/schema/${props.schema}/tables/${props.table}/browse`);

    url.searchParams.append("filter", `${field};${filter};${value}`);

    return url.toString();
  }, [filter, field, value]);

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.OpenInBrowser url={url} />
        </ActionPanel>
      }
    >
      <Form.TextField autoFocus id="field" title="Field" placeholder="Field" value={field} onChange={setField} />
      <Form.Dropdown id="condition" title="Condition" value={filter} onChange={setFilter}>
        <Form.Dropdown.Item value="$eq" title="Equal" />
        <Form.Dropdown.Item value="$neq" title="Not Equal" />
        <Form.Dropdown.Item value="$like" title="Like" />
        <Form.Dropdown.Item value="$ilike" title="ILike" />
      </Form.Dropdown>
      <Form.TextField id="value" title="Value" placeholder="Value" value={value} onChange={setValue} />

      <Form.Separator />

      <Form.TextField id="schema" title="Schema" placeholder="Schema" defaultValue={props.schema} />
      <Form.TextField id="table" title="Table" placeholder="Table name" defaultValue={props.table} />
    </Form>
  );
};

function TableListItem({
  server,
  item,
  metadata,
}: {
  server: ServerDetails;
  item: PostgresQualified_TableName;
  metadata?: string;
}) {
  return (
    <List.Item
      title={item.name}
      accessories={[{ text: item.schema }]}
      detail={<List.Item.Detail markdown={"```json\n" + metadata + "\n```"} />}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser
              title="Open in Browser"
              url={`${server.consoleUrl}/data/default/schema/${item.schema}/tables/${item.name}/browse`}
            />
            <Action.Push
              title="Open in Browser with Filter"
              target={<FilterForm schema={item.schema ?? "public"} table={item.name} consoleUrl={server.consoleUrl} />}
            />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
}
