import * as territoryService from './territory.service.js'
import * as territoryRules from './territoryRules.js'

export default {
  ...territoryService,
  ...territoryRules,
}
