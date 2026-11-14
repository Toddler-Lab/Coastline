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
import { PAYMENT_PROVIDER_NAMES } from '../modules/payments/payment-provider';

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
  @IsIn(['local', 'staging', 'production'])
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

  /**
   * Testing aid: skips the sunbed booked-hours and kitchen-hours checks when
   * ordering food to a sunbed. Refused in production.
   */
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  DINING_IGNORE_TIME_RULES?: boolean;

  /** Payment adapter. Only `sandbox` exists; any other value fails start-up. */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsIn([...PAYMENT_PROVIDER_NAMES])
  PAYMENT_PROVIDER?: string;

  /**
   * Deliberate opt-in to run the sandbox adapter in production. Without it,
   * production start-up with PAYMENT_PROVIDER=sandbox fails.
   */
  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  ALLOW_SANDBOX_PAYMENTS?: boolean;

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

  const isProduction = validated.NODE_ENV === 'production' || validated.APP_ENV === 'production';

  const demoEnabled = validated.DEMO_AUTH_ENABLED ?? true;
  if (demoEnabled && isProduction) {
    throw new Error('DEMO_AUTH_ENABLED must not be enabled in production');
  }

  if (validated.DINING_IGNORE_TIME_RULES && isProduction) {
    throw new Error('DINING_IGNORE_TIME_RULES must not be enabled in production');
  }

  const paymentProvider = validated.PAYMENT_PROVIDER ?? 'sandbox';
  if (paymentProvider === 'sandbox' && isProduction && validated.ALLOW_SANDBOX_PAYMENTS !== true) {
    throw new Error(
      'PAYMENT_PROVIDER=sandbox confirms bookings without collecting money; set ALLOW_SANDBOX_PAYMENTS=true to allow it in production',
    );
  }

  return {
    ...config,
    ...validated,
    DEMO_AUTH_ENABLED: demoEnabled,
    PAYMENT_PROVIDER: paymentProvider,
    ALLOW_SANDBOX_PAYMENTS: validated.ALLOW_SANDBOX_PAYMENTS ?? false,
  };
}
