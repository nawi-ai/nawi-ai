-- La pregunta puede reabrirse una vez, después de la pregunta de apoyo.
alter table public.reading_answers drop constraint if exists reading_answers_attempt_check;

alter table public.reading_answers
  add constraint reading_answers_attempt_check check (attempt_number between 1 and 3);
