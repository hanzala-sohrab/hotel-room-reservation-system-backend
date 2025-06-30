import {Entity, model, property} from '@loopback/repository';

@model({
  settings: {
    mysql: {
      schema: 'public',
      table: 'room',
    },
  },
})
export class Room extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id: number;

  @property({
    type: 'number',
    required: true,
  })
  floor: number;

  @property({
    type: 'boolean',
    required: true,
    mysql: {
      columnName: 'is_occupied',
    },
  })
  isOccupied: boolean;

  @property({
    type: 'number',
    mysql: {
      columnName: 'guest_id',
    },
  })
  guestId?: number;

  constructor(data?: Partial<Room>) {
    super(data);
  }
}

export interface RoomRelations {
  // describe navigational properties here
}

export type RoomWithRelations = Room & RoomRelations;
