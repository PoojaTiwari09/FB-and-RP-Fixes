import { PrismaClient } from '@prisma/client'; const p = new PrismaClient(); p.m05BoardColumn.count({ where: { board_id: 'brd-demo' } }).then(console.log).catch(console.error);
