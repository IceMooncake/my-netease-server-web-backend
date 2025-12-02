import * as territoryService from './territory.service.ts'
import * as territoryProposal from './territoryProposal.service.ts'
import * as territoryRules from './territoryRules.ts'

export default {
  ...territoryService,
  ...territoryProposal,
  ...territoryRules,
}
