module default {
  type Person {
    required property id: str {
      constraint exclusive;
    };
    required property full_name: str;
    required property gender: str {
      constraint enum ('مرد', 'زن');
    };
    link father: Person;
    link mother: Person;
    multi link spouses: Person; # Use multi link for multiple spouses
    property birth_year: int32;
  }
}
