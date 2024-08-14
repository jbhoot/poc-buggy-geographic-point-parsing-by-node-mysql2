create database if not exists test_lat_long;

create table testpoint(pos point NOT NULL) ENGINE=InnoDB;

insert into testpoint values (st_geomfromtext('POINT(-33.3109317 117.3461733)', 4326));

-- Following INSERT FAILS in mysql8 because lat-long validation is enforced for SRID 4326.
-- insert into testpoint values (st_geomfromtext('POINT(100 -33)', 4326));

insert into testpoint values (st_geomfromtext('POINT(-35.3109317 101.3461733)', 0));

insert into testpoint values (st_geomfromtext('POINT(101 -35)', 0));

