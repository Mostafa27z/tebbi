<?php

namespace App\Models;

/**
 * Backward compatibility alias: Clinic extends Facility.
 * Database table is 'facilities'.
 */
class Clinic extends Facility
{
    // Inherits everything from Facility with table = 'facilities'
}
