"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const data_source_1 = require("../database/data-source");
const entities_1 = require("../entities");
async function run() {
    const dataSource = new typeorm_1.DataSource(data_source_1.dataSourceOptions);
    await dataSource.initialize();
    const dealRepo = dataSource.getRepository(entities_1.Deal);
    const deals = await dealRepo.find({
        where: [
            { forecastCategory: entities_1.ForecastCategory.PIPELINE },
            { forecastCategory: entities_1.ForecastCategory.BEST_CASE },
        ],
        take: 5
    });
    for (const deal of deals) {
        deal.forecastCategory = entities_1.ForecastCategory.COMMIT;
        await dealRepo.save(deal);
        console.log(`Updated deal ${deal.name} to COMMIT.`);
    }
    console.log('Done.');
    await dataSource.destroy();
}
run().catch(console.error);
//# sourceMappingURL=update-commit-deals.js.map