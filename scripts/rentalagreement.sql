USE [bed_db]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[RentalAgreement](
	[AgreementID] [int] IDENTITY(1,1) NOT NULL,
	[AgrStartDate] [datetime] NULL,
	[AgrEndDate] [datetime] NULL,
	[AgrTermCondition] [varchar](max) NULL,
	[RentalPrice] [smallmoney] NULL,
	[OwnerID] [int] NULL,
	[StallID] [int] NULL,
 CONSTRAINT [PK_RentalAgreement] PRIMARY KEY CLUSTERED 
(
	[AgreementID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
ALTER TABLE [dbo].[RentalAgreement]  WITH CHECK ADD  CONSTRAINT [FK_RentalAgreement_Owner] FOREIGN KEY([OwnerID])
REFERENCES [dbo].[StallOwner] ([OwnerID])
GO
ALTER TABLE [dbo].[RentalAgreement] CHECK CONSTRAINT [FK_RentalAgreement_Owner]
GO
ALTER TABLE [dbo].[RentalAgreement]  WITH CHECK ADD  CONSTRAINT [FK_RentalAgreement_Stall] FOREIGN KEY([StallID])
REFERENCES [dbo].[FoodStall] ([StallID])
GO
ALTER TABLE [dbo].[RentalAgreement] CHECK CONSTRAINT [FK_RentalAgreement_Stall]
GO
ALTER TABLE [dbo].[RentalAgreement]  WITH CHECK ADD  CONSTRAINT [CK_RentalAgreement_Date] CHECK  (([AgrEndDate]>[AgrStartDate]))
GO
ALTER TABLE [dbo].[RentalAgreement] CHECK CONSTRAINT [CK_RentalAgreement_Date]
GO