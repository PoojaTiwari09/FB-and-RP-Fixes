export type EntityClass = new (...args: unknown[]) => unknown;
export declare function getRepositoryToken(entity: EntityClass): string;
export declare function InjectRepository(entity: EntityClass): ParameterDecorator;
