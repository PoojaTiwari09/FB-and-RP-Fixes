import { IChatMessage } from './message.interface';
import { IFeedbackJson } from './scorecard.interface';
import { IScenario } from './scenario.interface';

export interface ISession {
  id: string;
  rep_id: string;
  scenario_id: string;
  manager_id?: string | null;
  messages_json: IChatMessage[];
  feedback_json: IFeedbackJson | null;
  selected_voice_id?: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface ISessionWithScenario extends ISession {
  training_scenarios?: IScenario | null;
}
