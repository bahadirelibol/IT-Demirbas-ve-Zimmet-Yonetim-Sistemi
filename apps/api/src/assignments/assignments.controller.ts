import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { AssignmentsService } from './assignments.service';
import { AssignmentQueryDto, CreateAssignmentDto, ReturnAssignmentDto } from './dto/assignment.dto';

@Controller()
export class AssignmentsController {
  constructor(private readonly assignments: AssignmentsService) {}

  @Get('me/assets')
  mine(@CurrentUser() user: AuthUser) {
    return this.assignments.myAssets(user.id);
  }

  @Get('assignments')
  list(@Query() query: AssignmentQueryDto) {
    return this.assignments.list(query);
  }

  @Roles(Role.ADMIN)
  @Post('assignments')
  create(@Body() dto: CreateAssignmentDto, @CurrentUser() user: AuthUser) {
    return this.assignments.create(dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Post('assignments/:id/return')
  returnOne(
    @Param('id') id: string,
    @Body() dto: ReturnAssignmentDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assignments.returnOne(id, user.id, dto);
  }
}
