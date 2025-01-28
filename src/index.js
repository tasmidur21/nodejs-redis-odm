import { EntityId } from "redis-om";
import { Person } from "./examples/persion.js";

async function main() {
  // Create a person
  // const person = await Person.create({
  //   firstName: 'John',
  //   lastName: 'Doe',
  //   age: 30
  // });

  //console.log(person);
  console.log(await Person.all());

  


  //console.log(result);
}

main().catch(console.error);
