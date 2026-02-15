/*
  Warnings:

  - The values [CLEANUP_USER,RECYCLE_TERRITORY_SIZE] on the enum `admin_tasks_type` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `team_id` on the `territories` table. All the data in the column will be lost.
  - You are about to drop the `team_members` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teams` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vote_records` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `votes` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `owner_id` to the `territories` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `team_members` DROP FOREIGN KEY `team_members_qq_fkey`;

-- DropForeignKey
ALTER TABLE `team_members` DROP FOREIGN KEY `team_members_team_id_fkey`;

-- DropForeignKey
ALTER TABLE `teams` DROP FOREIGN KEY `teams_owner_id_fkey`;

-- DropForeignKey
ALTER TABLE `territories` DROP FOREIGN KEY `territories_team_id_fkey`;

-- DropForeignKey
ALTER TABLE `vote_records` DROP FOREIGN KEY `vote_records_vote_id_fkey`;

-- DropForeignKey
ALTER TABLE `vote_records` DROP FOREIGN KEY `vote_records_voter_qq_fkey`;

-- DropForeignKey
ALTER TABLE `votes` DROP FOREIGN KEY `votes_team_id_fkey`;

-- DropForeignKey
ALTER TABLE `votes` DROP FOREIGN KEY `votes_territory_id_fkey`;

-- DropIndex
DROP INDEX `territories_team_id_fkey` ON `territories`;

-- AlterTable
ALTER TABLE `admin_tasks` MODIFY `type` ENUM('REVIEW_TERRITORY_CREATE', 'REVIEW_TERRITORY_DELETE', 'REVIEW_TERRITORY_UPDATE') NOT NULL;

-- AlterTable
ALTER TABLE `territories` DROP COLUMN `team_id`,
    ADD COLUMN `credits` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `owner_id` VARCHAR(255) NOT NULL;

-- DropTable
DROP TABLE `team_members`;

-- DropTable
DROP TABLE `teams`;

-- DropTable
DROP TABLE `vote_records`;

-- DropTable
DROP TABLE `votes`;

-- CreateTable
CREATE TABLE `territory_members` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `qq` VARCHAR(255) NOT NULL,
    `territory_id` BIGINT NOT NULL,
    `joined_at` TIMESTAMP(0) NULL DEFAULT CURRENT_TIMESTAMP(0),
    `contribution` INTEGER NOT NULL DEFAULT 0,

    INDEX `territory_members_territory_id_idx`(`territory_id`),
    UNIQUE INDEX `uq_user_territory`(`qq`, `territory_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `invitations` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `territory_id` BIGINT NOT NULL,
    `inviter_qq` VARCHAR(255) NOT NULL,
    `invitee_qq` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `uq_territory_invitee`(`territory_id`, `invitee_qq`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `territories` ADD CONSTRAINT `territories_owner_id_fkey` FOREIGN KEY (`owner_id`) REFERENCES `users`(`qq`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `territory_members` ADD CONSTRAINT `territory_members_qq_fkey` FOREIGN KEY (`qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `territory_members` ADD CONSTRAINT `territory_members_territory_id_fkey` FOREIGN KEY (`territory_id`) REFERENCES `territories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_territory_id_fkey` FOREIGN KEY (`territory_id`) REFERENCES `territories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_inviter_qq_fkey` FOREIGN KEY (`inviter_qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `invitations` ADD CONSTRAINT `invitations_invitee_qq_fkey` FOREIGN KEY (`invitee_qq`) REFERENCES `users`(`qq`) ON DELETE CASCADE ON UPDATE CASCADE;
