"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeatmapRank = exports.Period = exports.UserRole = void 0;
var UserRole;
(function (UserRole) {
    UserRole["SALES_REP"] = "sales_rep";
    UserRole["SALES_MANAGER"] = "sales_manager";
    UserRole["CRO"] = "cro";
    UserRole["ADMIN_REVOPS"] = "revops";
})(UserRole || (exports.UserRole = UserRole = {}));
var Period;
(function (Period) {
    Period["NOW"] = "NOW";
    Period["LAST_30_DAYS"] = "LAST_30_DAYS";
    Period["LAST_90_DAYS"] = "LAST_90_DAYS";
})(Period || (exports.Period = Period = {}));
var HeatmapRank;
(function (HeatmapRank) {
    HeatmapRank[HeatmapRank["FIRST"] = 1] = "FIRST";
    HeatmapRank[HeatmapRank["SECOND"] = 2] = "SECOND";
    HeatmapRank[HeatmapRank["THIRD"] = 3] = "THIRD";
    HeatmapRank[HeatmapRank["NONE"] = 0] = "NONE";
})(HeatmapRank || (exports.HeatmapRank = HeatmapRank = {}));
//# sourceMappingURL=deal-drivers.entities.js.map