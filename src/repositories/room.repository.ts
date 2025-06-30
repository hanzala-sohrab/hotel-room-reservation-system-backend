import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {HotelDataSource} from '../datasources';
import {Room, RoomRelations} from '../models';

export class RoomRepository extends DefaultCrudRepository<
  Room,
  typeof Room.prototype.id,
  RoomRelations
> {
  constructor(
    @inject('datasources.Hotel') dataSource: HotelDataSource,
  ) {
    super(Room, dataSource);
  }
}
