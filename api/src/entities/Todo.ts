import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./User";

// Todo ORM
@Entity()
export class Todo extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column("text")
  text: string;

  @Column("boolean", { default: false })
  completed: boolean;

  @Column()
  creatorId: number;

  // relationship
  @ManyToOne(() => User, (user) => user.todos)
  @JoinColumn({name: 'creatorId'})
  creator: Promise<User>;
}
