"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepositoryToken = getRepositoryToken;
exports.InjectRepository = InjectRepository;
const common_1 = require("@nestjs/common");
function getRepositoryToken(entity) {
    return `${entity.name}Repository`;
}
function InjectRepository(entity) {
    return (0, common_1.Inject)(getRepositoryToken(entity));
}
//# sourceMappingURL=inject-repository.js.map