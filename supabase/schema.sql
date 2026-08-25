-- CafeFocus MVP 데이터 구조 (Supabase)
-- 현재 데모는 lib/data/cafes.ts 의 정적 데이터로 동작하며,
-- 실데이터 전환 시 이 스키마를 그대로 사용하면 된다.

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  nickname text,
  preferred_purpose text,          -- focus | study | meeting | light | reading
  preferred_priorities text[],     -- quiet, outlet, wifi, seat, access
  home_area text,
  created_at timestamptz default now()
);

create table if not exists cafes (
  id text primary key,             -- slug (예: cafe-morrow)
  name text not null,
  area text not null,              -- seongsu | gangnam | hongdae | jamsil | jongno | hapjeong
  address text not null,
  station text,
  station_distance_m int,
  lat double precision not null,
  lng double precision not null,
  open_hour int not null,
  close_hour int not null,
  rating numeric(2,1),
  review_count int default 0,
  wifi_mbps int,
  avg_stay_minutes int,
  description text,
  tags text[],
  restroom boolean default true,
  parking boolean default false,
  laptop_friendly boolean default true,
  big_table boolean default false,
  created_at timestamptz default now()
);

create table if not exists cafe_metrics (
  cafe_id text primary key references cafes(id) on delete cascade,
  noise_score int,                 -- 0-100, 높을수록 조용
  wifi_score int,
  outlet_score int,
  seat_score int,
  crowd_score int,                 -- 높을수록 한산
  stay_score int,
  work_score int                   -- 가중 평균 캐시
);

create table if not exists hourly_metrics (
  cafe_id text references cafes(id) on delete cascade,
  hour int not null check (hour between 0 and 23),
  noise int not null,              -- 0-100, 높을수록 시끄러움
  crowd int not null,              -- 0-100, 높을수록 붐빔
  primary key (cafe_id, hour)
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  cafe_id text references cafes(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  visit_time text,                 -- 평일 오전 / 주말 오후 ...
  purpose text,
  stay_minutes int,
  rating int check (rating between 1 and 5),
  text text,
  tags text[],
  created_at timestamptz default now()
);

create table if not exists favorites (
  user_id uuid references users(id) on delete cascade,
  cafe_id text references cafes(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, cafe_id)
);

create table if not exists recent_views (
  user_id uuid references users(id) on delete cascade,
  cafe_id text references cafes(id) on delete cascade,
  viewed_at timestamptz default now(),
  primary key (user_id, cafe_id)
);
