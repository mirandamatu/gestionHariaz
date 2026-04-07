import type { Client, CrmSnapshot, Interaction, ManualAsset, Task } from '@/types/domain'

export interface CrmRepository {
  getSnapshot(): CrmSnapshot
  upsertClient(client: Client): CrmSnapshot
  deleteClient(clientId: string): CrmSnapshot
  upsertTask(task: Task): CrmSnapshot
  deleteTask(taskId: string): CrmSnapshot
  upsertInteraction(interaction: Interaction): CrmSnapshot
  deleteInteraction(interactionId: string): CrmSnapshot
  upsertManual(manual: ManualAsset): CrmSnapshot
  deleteManual(manualId: string): CrmSnapshot
}
