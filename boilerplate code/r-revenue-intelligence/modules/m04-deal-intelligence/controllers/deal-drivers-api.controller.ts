import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { DealDriversApiService } from '../services/deal-drivers-api.service';
import type { CreateDealDriverDto, UpdateDealDriverDto } from '../interfaces/deal-driver.types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

@Controller('api/deal-drivers')
export class DealDriversApiController {
  constructor(private readonly dealDrivers: DealDriversApiService) {}

  @Get()
  async list(
    @Query('dealId') dealId?: string,
    @Query('boardId') boardId?: string,
  ): Promise<ApiResponse<unknown[]>> {
    const data = await this.dealDrivers.list({ dealId, boardId });
    return { success: true, data };
  }

  @Post()
  async create(@Body() body: CreateDealDriverDto): Promise<ApiResponse<unknown>> {
    const data = await this.dealDrivers.create(body);
    return { success: true, data };
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    const data = await this.dealDrivers.getById(id);
    return { success: true, data };
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDealDriverDto,
  ): Promise<ApiResponse<unknown>> {
    const data = await this.dealDrivers.update(id, body);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ApiResponse<unknown>> {
    const data = await this.dealDrivers.remove(id);
    return { success: true, data };
  }
}
