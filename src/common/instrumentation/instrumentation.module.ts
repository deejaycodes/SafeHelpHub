import { Global, Module } from '@nestjs/common';
import { ReportsInstrumentation } from './reports.instrumentation';
import { AuthInstrumentation } from './auth.instrumentation';
import { TrackingInstrumentation } from './tracking.instrumentation';
import { NgoInstrumentation } from './ngo.instrumentation';

const instrumentations = [ReportsInstrumentation, AuthInstrumentation, TrackingInstrumentation, NgoInstrumentation];

@Global()
@Module({
  providers: instrumentations,
  exports: instrumentations,
})
export class InstrumentationModule {}
