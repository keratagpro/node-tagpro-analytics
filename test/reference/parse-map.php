#!/usr/bin/php
<?php

// Copyright (c) 2015, Jeroen van der Gun
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//    conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list of
//    conditions and the following disclaimer in the documentation and/or other materials
//    provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT
// OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION)
// HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR
// TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
// SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

error_reporting(E_ALL);
ini_set('display_errors', '1');
if ($argc != 2)
    die('Usage: php ' . $argv[0] . " <filename>\n");

require './logreader.php';

class MapEventHandler extends MapLogReader
{
    protected function heightEvent($newY)
    {
        echo "\n";
    }

    protected function tileEvent($newX, $y, $tile)
    {
        switch ($tile) {
            case self::squareWallTile:
                echo '■';
                break;
            case self::lowerLeftDiagonalWallTile:
                echo '◣';
                break;
            case self::upperLeftDiagonalWallTile:
                echo '◤';
                break;
            case self::upperRightDiagonalWallTile:
                echo '◥';
                break;
            case self::lowerRightDiagonalWallTile:
                echo '◢';
                break;
            case self::redFlagTile:
            case self::blueFlagTile:
            case self::neutralFlagTile:
                echo '⚑';
                break;
            case self::neutralSpeedpadTile:
            case self::redSpeedpadTile:
            case self::blueSpeedpadTile:
                echo '⤧';
                break;
            case self::powerupTile:
                echo '◎';
                break;
            case self::spikeTile:
                echo '☼';
                break;
            case self::buttonTile:
                echo '•';
                break;
            case self::openGateTile:
            case self::closedGateTile:
            case self::redGateTile:
            case self::blueGateTile:
                echo '▦';
                break;
            case self::bombTile:
                echo '☢';
                break;
            default:
                echo ' ';
        }
    }
    
    public function __construct()
    {
        global $match;
        parent::__construct(base64_decode($match->map->tiles), $match->map->width);
    }
}

$match = json_decode(file_get_contents($argv[1]));

new MapEventHandler();

?>