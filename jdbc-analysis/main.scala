//> using dep "mysql:mysql-connector-java:8.0.33"

// Usage: MYSQL_USERNAME=<user> MYSQL_PASSWORD=<pwd> MYSQL_PORT=3306 MYSQL_SCHEMA=test_lat_long scala-cli run -w main.scala

import java.sql.{Connection, DriverManager}
import java.nio.ByteBuffer;
import java.util.Arrays;
import scala.compiletime.uninitialized;
import scala.collection.mutable.ArrayBuffer;

case class Coordinate(x: Double, y: Double)

object PointParser {
  def readDoubleFromBytesLittleEndian(bytes: Array[Byte]): Double = {
    val buf = ByteBuffer.wrap(bytes);
    buf.order(java.nio.ByteOrder.LITTLE_ENDIAN);
    val longVal = buf.getLong();
    java.lang.Double.longBitsToDouble(longVal);
  }

  def readDoubleFromBytes(bytes: Array[Byte], offset: Int): Double = {
    val bufOf8Bytes = Arrays.copyOfRange(bytes, offset, offset + 8);
    readDoubleFromBytesLittleEndian(bufOf8Bytes);
  }

  def readCoordinateInStoredOrderFromWkbBytes(wkbBytes: Array[Byte]) = {
    // Problem with MySQL 8: first segment of bytes is longitude, second is latitude.

    // Buggy parsing: x <- longitude, y <- latitude
    val x = readDoubleFromBytes(wkbBytes, 9);
    val y = readDoubleFromBytes(wkbBytes, 17);
    Coordinate(x, y)
  }

  def readCoordinateCorrectlyFromWkbBytes(wkbBytes: Array[Byte]) = {
    // Correct parsing: longitude -> y, latitude -> x
    val long = readDoubleFromBytes(wkbBytes, 9);
    val lat = readDoubleFromBytes(wkbBytes, 17);
    Coordinate(x = lat, y = long)
  }
}

@main def main() = {
  val schema = sys.env("MYSQL_SCHEMA")
  val port = sys.env("MYSQL_PORT")
  val url = "jdbc:mysql://localhost:%s/%s".format(port, schema)
  val username = sys.env("MYSQL_USERNAME")
  val password = sys.env("MYSQL_PASSWORD")
  val connection = DriverManager.getConnection(url, username, password)
  val statement = connection.createStatement
  val rs = statement.executeQuery(
    "SELECT pos FROM testpoint WHERE st_srid(pos) = 4326"
  )
  val incorrectResults = ArrayBuffer[Coordinate]()
  val correctResults = ArrayBuffer[Coordinate]()
  while (rs.next) {
    val pointBytes = rs.getBytes("pos")
    incorrectResults.addOne(
      PointParser.readCoordinateInStoredOrderFromWkbBytes(pointBytes)
    )
    correctResults.addOne(
      PointParser.readCoordinateCorrectlyFromWkbBytes(pointBytes)
    )
  }

  println(
    "\nIncorrect: when the stored order (long,lat) is read mistakenly into (x,y):"
  )
  incorrectResults.foreach(xy => println("x = %f, y = %f".format(xy.x, xy.y)))

  println(
    "\nCorrect: when the stored order (long,lat) is read correctly into (y,x):"
  )
  correctResults.foreach(xy => println("x = %f, y = %f".format(xy.x, xy.y)))

  println("\nDone")
  connection.close
}
