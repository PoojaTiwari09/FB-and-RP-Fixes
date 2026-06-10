"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateBoardDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_board_dto_1 = require("./create-board.dto");
class UpdateBoardDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_board_dto_1.CreateBoardDto, [])) {
}
exports.UpdateBoardDto = UpdateBoardDto;
//# sourceMappingURL=update-board.dto.js.map