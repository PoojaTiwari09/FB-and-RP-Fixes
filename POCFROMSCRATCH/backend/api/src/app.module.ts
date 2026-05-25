import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BoardsModule } from './boards/boards.module';
import { AccountsModule } from './accounts/accounts.module';
import { ActivitiesModule } from './activities/activities.module';
import { EditsModule } from './edits/edits.module';
import { TodosModule } from './todos/todos.module';
import { SyncModule } from './sync/sync.module';
import { PreferencesModule } from './preferences/preferences.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../.env.local',
      isGlobal: true,
    }),
    BoardsModule,
    AccountsModule,
    ActivitiesModule,
    EditsModule,
    TodosModule,
    SyncModule,
    PreferencesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
