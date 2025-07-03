import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  HttpErrors,
  param,
  post,
  requestBody,
  response,
} from '@loopback/rest';
import {MAX_ROOMS_PER_GUEST, ROOMS} from '../constants';
import {Room} from '../models';
import {RoomRepository} from '../repositories';

export class RoomController {
  constructor(
    @repository(RoomRepository)
    public roomRepository: RoomRepository,
  ) {}

  @post('/rooms')
  @response(200, {
    description: 'Room model instance',
    content: {'application/json': {schema: getModelSchemaRef(Room)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Room, {
            title: 'NewRoom',
            exclude: ['id'],
          }),
        },
      },
    })
    room: Omit<Room, 'id'>,
  ): Promise<Room> {
    return this.roomRepository.create(room);
  }

  @post('/rooms/book')
  @response(200, {
    description: 'Room model instance',
    content: {'application/json': {schema: getModelSchemaRef(Room)}},
  })
  async bookRooms(
    @requestBody() body: {count: number; guestId: string},
  ): Promise<Room[]> {
    const {guestId} = body;

    const rooms = await this.roomRepository.find();
    const roomsBookedByThisIndividual = rooms.filter(
      r => r.guestId === guestId,
    );

    const noOfRoomsBookedByThisIndividual = roomsBookedByThisIndividual.length;

    if (noOfRoomsBookedByThisIndividual === MAX_ROOMS_PER_GUEST) {
      throw new HttpErrors.BadRequest(ROOMS.BOOK_ROOM_LIMIT_EXCEEDED);
    }

    const availableRooms = rooms.filter(r => !r.isOccupied);

    const count = Math.min(MAX_ROOMS_PER_GUEST, body.count);

    const sorted = availableRooms.sort((a, b) => a.id - b.id);

    const bestCombo: Room[] = sorted.slice(0, count);

    for (const r of bestCombo) {
      r.isOccupied = true;
      r.guestId = guestId;

      await this.roomRepository.updateById(r.id, r);
    }

    return bestCombo;
  }

  @post('/rooms/reset')
  @response(200, {
    description: 'Room model instance',
    content: {'application/json': {schema: getModelSchemaRef(Room)}},
  })
  async resetRooms(): Promise<{}> {
    await this.roomRepository.updateAll({isOccupied: false, guestId: ''});
    return {
      status: 'success',
      message: 'All rooms have been reset',
    };
  }

  @post('/rooms/randomize')
  @response(200, {
    description: 'Random occupancy generated for all rooms',
    content: {
      'application/json': {
        schema: {type: 'array', items: getModelSchemaRef(Room)},
      },
    },
  })
  async generateRandomOccupancy(): Promise<Room[]> {
    const randomIds = Array.from(
      {length: Math.floor((Math.random() + 1) * 10)},
      () =>
        Math.floor(100 * Math.ceil(10 * Math.random()) + Math.random() * 10),
    );

    await Promise.allSettled(
      randomIds.map(id =>
        this.roomRepository.updateById(id, {
          isOccupied: Math.random() < 0.5,
          guestId: Math.random().toString(36).substring(2, 10),
        }),
      ),
    );

    return this.roomRepository.find();
  }

  @get('/rooms/count')
  @response(200, {
    description: 'Room model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(@param.where(Room) where?: Where<Room>): Promise<Count> {
    return this.roomRepository.count(where);
  }

  @get('/rooms')
  @response(200, {
    description: 'Array of Room model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Room, {includeRelations: true}),
        },
      },
    },
  })
  async find(@param.filter(Room) filter?: Filter<Room>): Promise<Room[]> {
    return this.roomRepository.find(filter);
  }

  // @patch('/rooms')
  // @response(200, {
  //   description: 'Room PATCH success count',
  //   content: {'application/json': {schema: CountSchema}},
  // })
  // async updateAll(
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Room, {partial: true}),
  //       },
  //     },
  //   })
  //   room: Room,
  //   @param.where(Room) where?: Where<Room>,
  // ): Promise<Count> {
  //   return this.roomRepository.updateAll(room, where);
  // }

  @get('/rooms/{id}')
  @response(200, {
    description: 'Room model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Room, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Room, {exclude: 'where'}) filter?: FilterExcludingWhere<Room>,
  ): Promise<Room> {
    return this.roomRepository.findById(id, filter);
  }

  // @patch('/rooms/{id}')
  // @response(204, {
  //   description: 'Room PATCH success',
  // })
  // async updateById(
  //   @param.path.number('id') id: number,
  //   @requestBody({
  //     content: {
  //       'application/json': {
  //         schema: getModelSchemaRef(Room, {partial: true}),
  //       },
  //     },
  //   })
  //   room: Room,
  // ): Promise<void> {
  //   await this.roomRepository.updateById(id, room);
  // }

  // @put('/rooms/{id}')
  // @response(204, {
  //   description: 'Room PUT success',
  // })
  // async replaceById(
  //   @param.path.number('id') id: number,
  //   @requestBody() room: Room,
  // ): Promise<void> {
  //   await this.roomRepository.replaceById(id, room);
  // }

  // @del('/rooms/{id}')
  // @response(204, {
  //   description: 'Room DELETE success',
  // })
  // async deleteById(@param.path.number('id') id: number): Promise<void> {
  //   await this.roomRepository.deleteById(id);
  // }
}
