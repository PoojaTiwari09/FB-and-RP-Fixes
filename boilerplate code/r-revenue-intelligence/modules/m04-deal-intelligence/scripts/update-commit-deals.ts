import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../database/data-source';
import { Deal, ForecastCategory } from '../entities';

async function run() {
  const dataSource = new DataSource(dataSourceOptions);
  await dataSource.initialize();
  const dealRepo = dataSource.getRepository(Deal);

  // find 5 PIPELINE or BEST_CASE deals
  const deals = await dealRepo.find({
    where: [
      { forecastCategory: ForecastCategory.PIPELINE },
      { forecastCategory: ForecastCategory.BEST_CASE },
    ],
    take: 5
  });

  for (const deal of deals) {
    deal.forecastCategory = ForecastCategory.COMMIT;
    await dealRepo.save(deal);
    console.log(`Updated deal ${deal.name} to COMMIT.`);
  }

  console.log('Done.');
  await dataSource.destroy();
}

run().catch(console.error);
