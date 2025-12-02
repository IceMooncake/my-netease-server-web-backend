// 1. generate openapi.json
import generateOpenApi from './generateOpenApi.ts'

// 2. generate fontend types
import generateApiTypes from './generateApiTypes.ts'

generateOpenApi()
generateApiTypes()
