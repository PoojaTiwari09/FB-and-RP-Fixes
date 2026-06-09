import { Inject } from '@nestjs/common';

export type EntityClass = new (...args: unknown[]) => unknown;

export function getRepositoryToken(entity: EntityClass): string {
  return `${entity.name}Repository`;
}

export function InjectRepository(entity: EntityClass): ParameterDecorator {
  return Inject(getRepositoryToken(entity));
}
