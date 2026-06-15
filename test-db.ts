import * as dotenv from 'dotenv';
dotenv.config();
import { AccountsService } from './modules/m05-account-intelligence/services/accounts.service';
async function test() {
  const service = new AccountsService();
  try {
    const res = await service.getAccountDetail('hs-demo-initech');
    console.log('Detail:', res);
  } catch (e) {
    console.error('Error:', e);
  }
}
test().catch(console.error).finally(()=>process.exit(0));
