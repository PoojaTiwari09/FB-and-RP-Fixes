import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddUserAndSession1779613135161 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
