import { Tabs, type TabsItem } from "../../../components/ui/tabs";

export function EventoBottomTabs({
  items,
  value,
  onValueChange,
}: {
  items: TabsItem[];
  value: string;
  onValueChange: (value: string) => void;
}) {
  return <Tabs items={items} value={value} onValueChange={onValueChange} defaultValue={items[0]?.id} />;
}
