import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthUser, CurrentUser } from '../common/current-user.decorator';
import { Roles } from '../common/roles.decorator';
import { AssetQueryDto, CreateAssetDto, FaultDto, UpdateAssetDto } from './dto/asset.dto';
import { AssetsService } from './assets.service';

@Controller('assets')
export class AssetsController {
  constructor(private readonly assets: AssetsService) {}

  @Get()
  list(@Query() query: AssetQueryDto) {
    return this.assets.list(query);
  }

  @Get('by-code/:qrCode')
  byCode(@Param('qrCode') qrCode: string) {
    return this.assets.byCode(qrCode);
  }

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() dto: CreateAssetDto, @CurrentUser() user: AuthUser) {
    return this.assets.create(dto, user.id);
  }

  @Get(':id/qr')
  @Header('Content-Type', 'image/png')
  @Header('Cache-Control', 'no-store')
  async qr(@Param('id') id: string) {
    const buffer = await this.assets.qrPng(id);
    return new StreamableFile(buffer);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.assets.detail(id);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAssetDto, @CurrentUser() user: AuthUser) {
    return this.assets.update(id, dto, user.id);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.assets.remove(id);
  }

  @Post(':id/fault')
  fault(@Param('id') id: string, @Body() dto: FaultDto, @CurrentUser() user: AuthUser) {
    return this.assets.reportFault(id, user, dto);
  }
}
