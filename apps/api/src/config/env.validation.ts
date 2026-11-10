import { plainToInstance, Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

/** Strict boolean parsing: the string "false" must never become true. */
function parseBoolean(value: unknown): unknown {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') {
      return true;
    }
    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }
  return value;
}

class EnvironmentVariables {
  @IsOptional()
  @IsIn(['development', 'test', 'production'])
  NODE_ENV?: string;

  @IsOptional()
  @IsIn(['local', 'demo', 'staging', 'production'])
  APP_ENV?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsOptional()
  @IsUrl({ require_tld: false, require_protocol: true, protocols: ['http', 'https'] })
  WEB_ORIGIN?: string;

  @IsOptional()
  @IsString()
  CORS_ORIGINS?: string;

  @IsString()
  @MinLength(1)
  @Matches(/^postgres(ql)?:\/\//, {
    message: 'DATABASE_URL must be a PostgreSQL connection string',
  })
  DATABASE_URL!: string;

  @IsOptional()
  @IsString()
  TEST_DATABASE_URL?: string;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  DEMO_AUTH_ENABLED?: boolean;

  @IsOptional()
  @IsString()
  TICKET_SECRET?: string;

  @IsOptional()
  @IsString()
  LOG_LEVEL?: string;
}

export function validateEnvironment(config: Record<string, unknown>): Record<string, unknown> {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: false,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
    forbidUnknownValues: false,
  });

  if (errors.length > 0) {
    const properties = [...new Set(errors.map((error) => error.property))].join(', ');
    throw new Error(`Invalid environment configuration: ${properties}`);
  }

  const demoEnabled = validated.DEMO_AUTH_ENABLED ?? true;
  if (demoEnabled && (validated.NODE_ENV === 'production' || validated.APP_ENV === 'production')) {
    throw new Error('DEMO_AUTH_ENABLED must not be enabled in production');
  }

  return { ...config, ...validated, DEMO_AUTH_ENABLED: demoEnabled };
}
